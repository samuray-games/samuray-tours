function authorizeCalendarScope_() {
  var calendar = CalendarApp.getDefaultCalendar();
  if (!calendar) {
    throw new Error('Default calendar not available');
  }

  if (typeof ScriptApp.requireScopes === 'function') {
    ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, ['https://www.googleapis.com/auth/calendar']);
  }

  var result = {
    authorized: true,
    calendarName: calendar.getName ? calendar.getName() : 'default'
  };
  console.log(JSON.stringify(result));
  return result;
}
