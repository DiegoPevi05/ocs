import type { ApiResponse } from './types';

export const mockData: ApiResponse = {
  calculation_time_ms: 0.030183,
  status: 'success',
  poles: [
    {
      lines: [
        {
          color: [100, 100, 100, 255],
          start: [0.0, 0.0, 10250.0],
          end: [0.0, 12000.0, 10250.0],
          name: 'Pole',
        },
      ],
      cantilevers: [
        {
          index: 0,
          results: [
            { cut_length: 2892, diameter: 55,   length: 2882, name: 'stay_tube',    thickness: 3.5 },
            { cut_length: 3109, diameter: 70,   length: 3099, name: 'bracket_tube', thickness: 4.0 },
            { cut_length: 302,  diameter: 33.7, length: 292,  name: 'register_arm', thickness: 3.2 },
            { cut_length: 1343, diameter: 33.7, length: 1333, name: 'steady_arm',   thickness: 2.5 },
          ],
          lines: [
            {
              color: [0, 121, 241, 255],
              start: [419.5593545089428,  5946.623471948829, 10250.0],
              end:   [3276.0532423042598, 6328.386053913059, 10250.0],
              name:  'Stay Tube',
            },
            {
              color: [0, 228, 48, 255],
              start: [412.0782217490983,  4527.007836907715, 10250.0],
              end:   [3020.1065945226985, 6200.966526572901, 10250.0],
              name:  'Bracket Tube',
            },
            {
              color: [153, 50, 204, 255],
              start: [2430.171158787871,  5714.379659555213, 10250.0],
              end:   [2138.6017075403917, 5704.197829957365, 10250.0],
              name:  'Register Arm',
            },
            {
              color: [255, 128, 0, 255],
              start: [3288.7362204027729, 5552.874938945182, 10250.0],
              end:   [1967.4837845625576, 5727.659674991209, 10250.0],
              name:  'Steady Arm',
            },
          ],
        },
        {
          index: 1,
          results: [
            { cut_length: 2892, diameter: 55,   length: 2882, name: 'stay_tube',    thickness: 3.5 },
            { cut_length: 3109, diameter: 70,   length: 3099, name: 'bracket_tube', thickness: 4.0 },
            { cut_length: 96,   diameter: 33.7, length: 86,   name: 'register_arm', thickness: 3.2 },
            { cut_length: 1284, diameter: 33.7, length: 1274, name: 'steady_arm',   thickness: 2.5 },
          ],
          lines: [
            {
              color: [0, 121, 241, 255],
              start: [419.5593545089428,  5946.623471948829, 9750.0],
              end:   [3276.0532423042598, 6328.386053913059, 9750.0],
              name:  'Stay Tube',
            },
            {
              color: [0, 228, 48, 255],
              start: [412.0782217490983,  4527.007836907715, 9750.0],
              end:   [3020.1065945226985, 6200.966526572901, 9750.0],
              name:  'Bracket Tube',
            },
            {
              color: [153, 50, 204, 255],
              start: [2102.677187263974,  5498.59427710472,  9750.0],
              end:   [2188.571248891346,  5495.594790377921, 9750.0],
              name:  'Register Arm',
            },
            {
              color: [255, 128, 0, 255],
              start: [3288.7362204027729, 5552.874938945182, 9750.0],
              end:   [2017.4533259135124, 5466.549025871677, 9750.0],
              name:  'Steady Arm',
            },
          ],
        },
      ],
    },
  ],
};
