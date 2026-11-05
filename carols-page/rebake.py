#!/usr/bin/env python3
"""Rebake data.json for Carol's stock page from Massive grouped daily data.

Carol's page (index.html beside this script) used to fetch prices in-browser
from stooq, which fails on her network. This script runs on Muse's side
instead: it pulls grouped daily US-stock aggregates from the Massive API
(custom.massive connector, surrogate credential — the key is never read,
printed, or stored here) for five trading days — the most recent completed
day D, the previous trading day, and the trading days nearest D-7, D-30 and
D-365 calendar days — and writes a compact same-origin data.json the page can
load without any third-party fetch:

    {"asof": "Wednesday, Nov 4", "date": "2026-11-04",
     "symbols": {"AAPL": {"c": .., "p": .., "w": .., "m": .., "y": ..}, ...}}

c = close on D, p = close on the previous trading day, w/m/y = closes on the
~week/~month/~year-ago trading days. The page derives today% from c vs p,
week% from c vs w, month% from c vs m, year% from c vs y. Keys for days a
symbol did not trade (e.g. a recent IPO has no year-ago close) are omitted.

It also bakes the market board (Dow, S&P 500, Nasdaq Composite, VIX,
10-year rate) for day D into the same file as a "board" object with the
same shape livebake.py writes into live.json ({"dow": {"val": .., "prev":
..}, ...}), fetched from the same Cboe delayed-quote files and Nasdaq API
and gated on each quote's timestamp falling on day D. The board is
best-effort: rows that fail validation are omitted, and if no row
validates the payload simply has no "board" key and the page keeps its
baked-in board values. The page's applyData() renders the board from
data.json whenever it is present, so the morning board no longer depends
on hand-edited HTML literals.

Free-plan limit is five requests per minute, so request starts are paced at
least 12.1 seconds apart, matching the connector's probe helper.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import read_response_body, url_with_surrogate_query_param

REQUEST_INTERVAL_SECONDS = 12.1
MIN_RESULTS = 1000  # a real US trading day returns ~12k grouped rows
MAX_WALK_BACK_DAYS = 10
ET = ZoneInfo("America/New_York")

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(HERE, "data.json")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise RuntimeError("redirect refused, verify the endpoint")


_last_start = None


def fetch_grouped(date_str):
    """Fetch one date of grouped daily aggregates (never raises).

    Returns {"ok": bool, "status": int, "closes": {ticker: close}}.
    """
    global _last_start
    if _last_start is not None:
        wait = REQUEST_INTERVAL_SECONDS - (time.monotonic() - _last_start)
        if wait > 0:
            time.sleep(wait)
    _last_start = time.monotonic()

    base = (
        "https://api.massive.com/v2/aggs/grouped/locale/us/market/stocks/"
        f"{date_str}?adjusted=true"
    )
    url = url_with_surrogate_query_param(
        base, "custom.massive", allowed_hosts=["api.massive.com"]
    )
    request = urllib.request.Request(url)
    try:
        with urllib.request.build_opener(NoRedirect()).open(
            request, timeout=60
        ) as response:
            data = json.loads(read_response_body(response))
            results = data.get("results", [])
            closes = {}
            for row in results:
                ticker = row.get("T")
                close = row.get("c")
                if ticker and isinstance(close, (int, float)):
                    closes[ticker] = round(float(close), 4)
            return {"ok": response.status == 200, "status": response.status,
                    "closes": closes}
    except urllib.error.HTTPError as exc:
        return {"ok": False, "status": exc.code, "closes": {}}
    except Exception:
        return {"ok": False, "status": 0, "closes": {}}


BOARD_UA = ("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 "
            "Mobile/15E148 Safari/604.1")
CBOE_URL = "https://cdn.cboe.com/api/global/delayed_quotes/quotes/{}.json"


def _board_get_json(url, timeout=12):
    req = urllib.request.Request(
        url, headers={"User-Agent": BOARD_UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _cboe_board_quote(fname, day):
    """(price, prev_close) from a Cboe delayed-quote file, or None.

    Valid only when the quote's own timestamp falls on `day` (ET) — for
    the morning bake that is the completed trading day D, whose close is
    the file's current_price and whose prev_day_close is D-1's close.
    """
    try:
        j = _board_get_json(CBOE_URL.format(fname))
        d = j.get("data") or {}
        price = float(d["current_price"])
        prev = float(d["prev_day_close"])
        ts = datetime.strptime(j["timestamp"], "%Y-%m-%d %H:%M:%S")
        ts_et = ts.replace(tzinfo=timezone.utc).astimezone(ET)
        if price <= 0 or prev <= 0 or ts_et.date() != day:
            return None
        return price, prev
    except Exception:
        return None


def _nasdaq_comp_board(day):
    """(price, prev_close) for the Nasdaq Composite, or None."""
    try:
        j = _board_get_json(
            "https://api.nasdaq.com/api/quote/COMP/info?assetclass=index")
        pd = (j.get("data") or {}).get("primaryData") or {}
        price = float(pd["lastSalePrice"].replace("$", "").replace(",", ""))
        chg = float(pd["netChange"].replace(",", ""))
        ts = datetime.strptime(pd["lastTradeTimestamp"], "%b %d, %Y %I:%M %p ET")
        ts = ts.replace(tzinfo=ET)
        if price <= 0 or ts.date() != day:
            return None
        return price, price - chg
    except Exception:
        return None


def fetch_board(day):
    """Market board for the completed trading day `day` (best-effort).

    Same sources and shape as livebake.py's board: Dow from Cboe's DJX
    file (hundredths) x100; the 10-year from Cboe's TNX file /10.
    """
    board = {}
    spx = _cboe_board_quote("_SPX", day)
    if spx:
        board["spx"] = {"val": round(spx[0], 2), "prev": round(spx[1], 2)}
    djx = _cboe_board_quote("_DJX", day)
    if djx:
        board["dow"] = {"val": round(djx[0] * 100, 2),
                        "prev": round(djx[1] * 100, 2)}
    comp = _nasdaq_comp_board(day)
    if comp:
        board["ndq"] = {"val": round(comp[0], 2), "prev": round(comp[1], 2)}
    vix = _cboe_board_quote("_VIX", day)
    if vix:
        board["vix"] = {"val": round(vix[0], 2), "prev": round(vix[1], 2)}
    tnx = _cboe_board_quote("_TNX", day)
    if tnx:
        board["tnx"] = {"val": round(tnx[0] / 10.0, 3),
                        "prev": round(tnx[1] / 10.0, 3)}
    return board


_cache = {}


def trading_day_on_or_before(target):
    """Nearest date <= target whose grouped fetch has real data.

    Returns (date, closes) or (None, {}) if nothing found within the
    walk-back window. HTTP errors abort immediately (per connector doc:
    a 401/403 means stop, do not retry or walk around it).
    """
    for offset in range(MAX_WALK_BACK_DAYS + 1):
        day = target - timedelta(days=offset)
        key = day.isoformat()
        if key not in _cache:
            _cache[key] = fetch_grouped(key)
        got = _cache[key]
        if not got["ok"]:
            raise SystemExit(
                f"FATAL: grouped fetch for {key} failed with HTTP "
                f"{got['status']}; stopping (check the request/credential "
                "before retrying)."
            )
        if len(got["closes"]) >= MIN_RESULTS:
            return day, got["closes"]
    return None, {}


def main():
    now_et = datetime.now(ET)
    today = now_et.date()
    # Most recent completed trading day: today only counts once the close
    # is well past (grouped data settles after 16:00 ET; use 16:30 buffer).
    if today.weekday() < 5 and now_et.time() >= datetime.min.time().replace(
        hour=16, minute=30
    ):
        candidate = today
    else:
        candidate = today - timedelta(days=1)

    d_day, closes_d = trading_day_on_or_before(candidate)
    if d_day is None:
        raise SystemExit("FATAL: no trading day with data found near "
                         f"{candidate}; data.json not written.")
    print(f"D (latest completed trading day): {d_day.isoformat()} "
          f"({len(closes_d)} symbols)")

    targets = [
        ("p", d_day - timedelta(days=1)),    # previous trading day
        ("w", d_day - timedelta(days=7)),    # ~one week ago
        ("m", d_day - timedelta(days=30)),   # ~one month ago
        ("y", d_day - timedelta(days=365)),  # ~one year ago
    ]
    past = {}
    for label, target in targets:
        day, closes = trading_day_on_or_before(target)
        if day is None:
            raise SystemExit(f"FATAL: no trading day with data found near "
                             f"{target} for '{label}'; data.json not written.")
        past[label] = closes
        print(f"{label}: {day.isoformat()} ({len(closes)} symbols)")

    symbols = {}
    for ticker, close in closes_d.items():
        record = {"c": close}
        for label in ("p", "w", "m", "y"):
            value = past[label].get(ticker)
            if value is not None:
                record[label] = value
        symbols[ticker] = record

    board = fetch_board(d_day)
    if board:
        print(f"board for {d_day.isoformat()}: {json.dumps(board)}")
    else:
        print(f"WARNING: no board rows validated for {d_day.isoformat()}; "
              "data.json will carry no board and the page keeps its "
              "baked-in board values.")

    asof = d_day.strftime("%A, %b ") + str(d_day.day)
    payload = {"asof": asof, "date": d_day.isoformat(), "symbols": symbols}
    if board:
        payload["board"] = board
    text = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        fh.write(text)

    print(f"data.json written: {OUT_PATH}")
    print(f"file size: {len(text.encode('utf-8'))} bytes")
    print(f"symbol count: {len(symbols)}")
    print(f"asof: {asof}")
    print(f"ED record: {json.dumps(symbols.get('ED'))}")
    print(f"AAPL record: {json.dumps(symbols.get('AAPL'))}")

    ed_close = (symbols.get("ED") or {}).get("c")
    if d_day.isoformat() == "2026-11-04" and ed_close != 120.30:
        print(f"WARNING: ED close on 2026-11-04 is {ed_close}, "
              "expected the known true close 120.30!")


if __name__ == "__main__":
    main()
