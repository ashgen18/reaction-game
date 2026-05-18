function getRating(ms) {
  if      (ms < 150) return { label: 'Superhuman ⚡', cls: 'r-elite'     };
  else if (ms < 200) return { label: 'Amazing',           cls: 'r-elite'     };
  else if (ms < 250) return { label: 'Very Good',         cls: 'r-excellent' };
  else if (ms < 300) return { label: 'Good',              cls: 'r-great'     };
  else if (ms < 400) return { label: 'Average',           cls: 'r-average'   };
  else if (ms < 600) return { label: 'Below Average',     cls: 'r-average'   };
  else               return { label: 'Keep Practicing',   cls: 'r-slow'      };
}

if (typeof module !== 'undefined') module.exports = { getRating };
