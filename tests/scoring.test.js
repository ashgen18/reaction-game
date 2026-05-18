const { getRating } = require('../src/game/scoring');

describe('getRating — boundary values', () => {
  test.each([
    [0,   'Superhuman ⚡', 'r-elite'    ],
    [100, 'Superhuman ⚡', 'r-elite'    ],
    [149, 'Superhuman ⚡', 'r-elite'    ],
    [150, 'Amazing',       'r-elite'    ],
    [199, 'Amazing',       'r-elite'    ],
    [200, 'Very Good',     'r-excellent'],
    [249, 'Very Good',     'r-excellent'],
    [250, 'Good',          'r-great'    ],
    [299, 'Good',          'r-great'    ],
    [300, 'Average',       'r-average'  ],
    [399, 'Average',       'r-average'  ],
    [400, 'Below Average', 'r-average'  ],
    [599, 'Below Average', 'r-average'  ],
    [600, 'Keep Practicing','r-slow'    ],
    [999, 'Keep Practicing','r-slow'    ],
  ])('getRating(%i) → { label: "%s", cls: "%s" }', (ms, label, cls) => {
    expect(getRating(ms)).toEqual({ label, cls });
  });
});
