import { useState } from 'react';
 
const getDaysInMonth     = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
 
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
 
// 12-hour format: "15:19:00" → "03:19 PM"
const fmtTime = val => {
  if (!val) return "—";
  const [hStr, mStr] = val.slice(0, 5).split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${ampm}`;
};
 
const CalendarView = ({ apts, patientName, doctorName, tokenColors, statusColor }) => {
  const today = new Date();
  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth());
  const [selected, setSelected] = useState(null);
 
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
  };
 
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
 
  const aptsOnDay = day => {
    const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return apts.filter(a => a.appointment_date === dateStr);
  };
 
  const selectedApts = selected ? aptsOnDay(selected) : [];
 
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
 
  const isToday = day =>
    day &&
    today.getFullYear() === year &&
    today.getMonth()    === month &&
    today.getDate()     === day;
 
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
 
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-slate-800">{MONTH_NAMES[month]} {year}</h2>
        <div className="flex gap-1">
          <button onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 transition-colors text-sm font-bold">‹</button>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); }}
            className="px-3 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 transition-colors text-xs font-medium">Today</button>
          <button onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 transition-colors text-sm font-bold">›</button>
        </div>
      </div>
 
      <div className="flex">
 
        {/* Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>
 
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const dayApts    = aptsOnDay(day);
              const isSelected = selected === day;
              const isTodayDay = isToday(day);
 
              return (
                <button
                  key={day}
                  onClick={() => setSelected(isSelected ? null : day)}
                  className={`
                    relative min-h-[64px] p-1.5 rounded-xl border text-left transition-all
                    ${isSelected
                      ? "border-teal-400 bg-teal-50"
                      : isTodayDay
                        ? "border-teal-200 bg-teal-50/40"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"}
                  `}
                >
                  <span
                    className="inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1"
                    style={isTodayDay ? { background: "#0E6C68", color: "#fff" } : { color: "#475569" }}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayApts.slice(0, 2).map(a => (
                      <div
                        key={a.id}
                        className="text-[10px] font-medium px-1 py-0.5 rounded text-white truncate"
                        style={{ background: tokenColors.current[a.id] || "#0E6C68" }}
                        title={patientName(a.patient_id)}
                      >
                        {fmtTime(a.slot_time)} {patientName(a.patient_id).split(" ")[0]}
                      </div>
                    ))}
                    {dayApts.length > 2 && (
                      <div className="text-[10px] text-slate-400 pl-1">+{dayApts.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
 
        {/* Side panel */}
        {selected && (
          <div className="w-72 border-l border-gray-100 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              {MONTH_NAMES[month]} {selected}
              <span className="ml-2 text-xs font-normal text-slate-400">
                {selectedApts.length} apt{selectedApts.length !== 1 ? "s" : ""}
              </span>
            </h3>
            {selectedApts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No appointments this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedApts.map(a => (
                  <div key={a.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: tokenColors.current[a.id] || "#0E6C68" }}
                      >
                        {a.token_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{patientName(a.patient_id)}</p>
                        <p className="text-[11px] text-slate-400 truncate">{doctorName(a.doctor_id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{fmtTime(a.slot_time)}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ background: statusColor(a.status) }}
                      >
                        {a.status}
                      </span>
                    </div>
                    {a.notes && (
                      <p className="mt-1.5 text-[11px] text-slate-400 italic truncate">{a.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
 
      </div>
    </div>
  );
};
 
export default CalendarView;