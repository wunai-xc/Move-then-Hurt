export const arrowIcon = {
    'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
    'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
};

export const rotateDir180 = {
    'N': 'S', 'NE': 'SW', 'E': 'W', 'SE': 'NW',
    'S': 'N', 'SW': 'NE', 'W': 'E', 'NW': 'SE'
};

export const dirPositions = {
    'N':  { top: '0%', left: '50%', transform: 'translate(-50%, -50%)' },
    'NE': { top: '0%', left: '100%', transform: 'translate(-50%, -50%)' },
    'E':  { top: '50%', left: '100%', transform: 'translate(-50%, -50%)' },
    'SE': { top: '100%', left: '100%', transform: 'translate(-50%, -50%)' },
    'S':  { top: '100%', left: '50%', transform: 'translate(-50%, -50%)' },
    'SW': { top: '100%', left: '0%', transform: 'translate(-50%, -50%)' },
    'W':  { top: '50%', left: '0%', transform: 'translate(-50%, -50%)' },
    'NW': { top: '0%', left: '0%', transform: 'translate(-50%, -50%)' }
};

export const dirOffset = {
    'N':  [-1, 0], 'NE': [-1, 1], 'E':  [0, 1], 'SE': [1, 1],
    'S':  [1, 0], 'SW': [1, -1], 'W':  [0, -1], 'NW': [-1, -1]
};