let REVIEWS_DB = [
  {
    id: 'r1',
    vendorName: 'Ramesh Grocery',
    date: '12 May 2026',
    rating: 5.0,
    categories: 'Vegetables, Fruits',
    comment: 'Very fresh vegetables and fruits. On time delivery and very good service!',
    helpfulCount: 2
  }
];

export const getReviews = async (req, res) => {
  try {
    return res.status(200).json({ success: true, count: REVIEWS_DB.length, reviews: REVIEWS_DB });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { vendorName, rating, comment } = req.body;
    const newRev = {
      id: 'rev_' + Date.now(),
      vendorName: vendorName || 'Ramesh Grocery',
      date: 'Today',
      rating: rating || 5,
      categories: 'Vegetables',
      comment: comment || 'Great service!',
      helpfulCount: 0
    };
    REVIEWS_DB.unshift(newRev);
    return res.status(201).json({ success: true, review: newRev });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
