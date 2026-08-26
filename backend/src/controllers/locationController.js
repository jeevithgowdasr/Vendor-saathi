const LOCATIONS_DB = [
  { name: 'Mijar', town: 'Moodbidri', district: 'Dakshina Kannada', pincode: '574225', vendorsCount: 4 },
  { name: 'Moodbidri Market', town: 'Moodbidri', district: 'Dakshina Kannada', pincode: '574227', vendorsCount: 6 },
  { name: 'Kallamundkur', town: 'Belvai', district: 'Dakshina Kannada', pincode: '574213', vendorsCount: 3 },
  { name: 'Belvai', town: 'Moodbidri', district: 'Dakshina Kannada', pincode: '574213', vendorsCount: 4 },
  { name: 'Mulki', town: 'Mangaluru North', district: 'Dakshina Kannada', pincode: '574154', vendorsCount: 5 }
];

export const getLocations = async (req, res) => {
  try {
    return res.status(200).json({ success: true, count: LOCATIONS_DB.length, locations: LOCATIONS_DB });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
