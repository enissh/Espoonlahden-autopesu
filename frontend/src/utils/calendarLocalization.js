const finnishMessages = {
  allDay: 'Koko päivä',
  previous: 'Edellinen',
  next: 'Seuraava',
  today: 'Tänään',
  month: 'Kuukausi',
  week: 'Viikko',
  day: 'Päivä',
  agenda: 'Agenda',
  date: 'Päivämäärä',
  time: 'Aika',
  event: 'Tapahtuma',
  showMore: total => `+ ${total} lisää`,
  noEventsInRange: 'Ei varauksia tällä aikavälillä.',
};

const finnishLocalizer = {
  ...finnishMessages,
  week: 'Viikko',
  work_week: 'Työviikko',
  day: 'Päivä',
  month: 'Kuukausi',
  previous: 'Edellinen',
  next: 'Seuraava',
  today: 'Tänään',
  agenda: 'Lista',

  dayFormat: 'dd D.M.',
  weekdayFormat: 'dd',
  monthHeaderFormat: 'MMMM YYYY',
  dayHeaderFormat: 'dddd D.M.YYYY',
  dayRangeHeaderFormat: ({ start, end }) => `${start.format('D.M.YYYY')} - ${end.format('D.M.YYYY')}`,

  formats: {
    monthHeaderFormat: 'MMMM YYYY',
    dayHeaderFormat: 'dddd D.M.YYYY',
    dayRangeHeaderFormat: ({ start, end }) => `${start.format('D.M.YYYY')} - ${end.format('D.M.YYYY')}`,
    agendaDateFormat: 'ddd D.M.',
    agendaTimeFormat: 'HH:mm',
    agendaTimeRangeFormat: ({ start, end }) => `${start} - ${end}`,
  },
};

export { finnishMessages, finnishLocalizer }; 