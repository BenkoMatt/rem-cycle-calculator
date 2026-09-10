/* REM Cycle Calculator — pure math helpers. No DOM. Loaded before the inline app JS. */
'use strict';

var MIN_PER_DAY = 1440;
var CYCLE_MINUTES = 90;

function wrapMinutes(totalMin) {
  return ((Math.round(totalMin) % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
}

/* "10:45 PM" | "3:45 AM" — 12-hour clock, no leading zero on the hour. */
function minutesToClock(totalMin) {
  var m = wrapMinutes(totalMin);
  var h24 = Math.floor(m / 60);
  var mm = m % 60;
  var h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return h12 + ':' + (mm < 10 ? '0' + mm : mm) + ' ' + (h24 < 12 ? 'AM' : 'PM');
}

/* Total minutes in bed: cycles + latency. 5 cycles + 15 latency -> 465. */
function cyclesToHours(cycles, latencyMin) {
  return cycles * CYCLE_MINUTES + (latencyMin || 0);
}

/* 465 -> "7h 45m" */
function formatDuration(totalMin) {
  var t = Math.max(0, Math.round(totalMin));
  return Math.floor(t / 60) + 'h ' + (t % 60) + 'm';
}

/* bedtime = wake − latency − cycles × 90. Returns 6, 5, 4 cycles.
   nextDay: true when the bedtime lands on the wake day's calendar date
   (after midnight, e.g. 12:15 AM before a 6:30 AM wake); false when it is
   the previous evening (9:15 PM). */
function computeBedtimes(wakeMin, latencyMin) {
  var lat = latencyMin || 0;
  return [6, 5, 4].map(function (cycles) {
    var raw = Math.round(wakeMin) - lat - cycles * CYCLE_MINUTES;
    return {
      cycles: cycles,
      minutes: wrapMinutes(raw),
      nextDay: raw >= 0,
      latencyMin: lat
    };
  });
}

/* wake = sleepStart + latency + cycles × 90. Returns 3, 4, 5, 6 cycles.
   nextDay: true when the wake time crosses midnight (always for overnight). */
function computeWakeTimes(sleepStartMin, latencyMin) {
  var lat = latencyMin || 0;
  return [3, 4, 5, 6].map(function (cycles) {
    var raw = Math.round(sleepStartMin) + lat + cycles * CYCLE_MINUTES;
    return {
      cycles: cycles,
      minutes: wrapMinutes(raw),
      nextDay: raw >= MIN_PER_DAY,
      latencyMin: lat
    };
  });
}

var REMCalc = {
  wrapMinutes: wrapMinutes,
  minutesToClock: minutesToClock,
  cyclesToHours: cyclesToHours,
  formatDuration: formatDuration,
  computeBedtimes: computeBedtimes,
  computeWakeTimes: computeWakeTimes
};

/* Browser: REMCalc is a global. Node/QA harness: CommonJS export. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = REMCalc;
}