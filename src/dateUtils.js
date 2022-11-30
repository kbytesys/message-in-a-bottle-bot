const dateDifferenceInMinutes = (date1, date2) => {
  const difference = date1.getTime() - date2.getTime();
  return Math.floor(difference / 1000 / 60);
};

module.exports = { dateDifferenceInMinutes };
