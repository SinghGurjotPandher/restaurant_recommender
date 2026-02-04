const { haversineDistance } = require('../../utils/distance');

describe('distance calculation test', () => {

    // test 0 distance 
    test('return 0 for same coordinates', () => {
        const distance = haversineDistance(33.6405, -117.8443, 33.6405, -117.8443);
        expect(distance).toBeCloseTo(0, 5);
    });

    // test known distance
    test('UCI to Newport Beach distance', () => {
        const distance = haversineDistance(33.669464, -117.823112, 33.618912, -117.928947);
        expect(distance).toBeCloseTo(7, 1);
    });
})