let ORDERS_DB = [
  {
    orderId: 'VS10245',
    vendorId: 'v1',
    vendorName: 'Ramesh Grocery',
    vendorPhone: '+91 98451 23456',
    customerName: 'Bhavana Bai',
    customerPhone: '+91 9876543210',
    deliveryAddress: 'Bhavana Bai, Mijar, Moodbidri, Karnataka - 574225',
    items: [
      { id: 'p1', name: 'Fresh Farm Red Tomatoes', price: 25, unit: 'kg', quantity: 2 },
      { id: 'p2', name: 'Fresh Local Potatoes', price: 30, unit: 'kg', quantity: 1 },
      { id: 'p4', name: 'Spicy Green Chillies', price: 40, unit: '250 g', quantity: 1 }
    ],
    subtotal: 120,
    deliveryFee: 20,
    discount: 0,
    total: 140,
    paymentMethod: 'Cash on Delivery',
    status: 'Out for Delivery',
    date: '12 May 2026, 10:30 AM',
    timeline: [
      { status: 'Placed', label: 'Order Placed', time: '10:30 AM', completed: true },
      { status: 'Accepted', label: 'Vendor Accepted', time: '10:35 AM', completed: true },
      { status: 'Preparing', label: 'Preparing Your Order', time: '10:45 AM', completed: true },
      { status: 'Out for Delivery', label: 'Out for Delivery', time: '11:00 AM', completed: true },
      { status: 'Delivered', label: 'Delivered', time: 'Expected by 11:30 AM', completed: false }
    ]
  }
];

export const createOrder = async (req, res) => {
  try {
    const { vendorId, vendorName, items, subtotal, deliveryFee, total, paymentMethod, deliveryAddress } = req.body;
    const newOrderId = `VS${Math.floor(10000 + Math.random() * 90000)}`;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      orderId: newOrderId,
      vendorId: vendorId || 'v1',
      vendorName: vendorName || 'Ramesh Grocery',
      vendorPhone: '+91 98451 23456',
      customerName: 'Bhavana Bai',
      customerPhone: '+91 9876543210',
      deliveryAddress: deliveryAddress || 'Mijar, Moodbidri - 574225',
      items: items || [],
      subtotal: subtotal || 100,
      deliveryFee: deliveryFee || 20,
      total: total || 120,
      paymentMethod: paymentMethod || 'UPI',
      status: 'Placed',
      date: `Today, ${timeNow}`,
      timeline: [
        { status: 'Placed', label: 'Order Placed', time: timeNow, completed: true },
        { status: 'Accepted', label: 'Vendor Accepted', time: 'Pending', completed: false },
        { status: 'Preparing', label: 'Preparing Your Order', time: 'Pending', completed: false },
        { status: 'Out for Delivery', label: 'Out for Delivery', time: 'Pending', completed: false },
        { status: 'Delivered', label: 'Delivered', time: 'Pending', completed: false }
      ]
    };

    ORDERS_DB.unshift(newOrder);

    // Emit Socket.IO event to Vendor App if socket server attached
    if (req.io) {
      req.io.emit('new_order_received', newOrder);
    }

    return res.status(201).json({ success: true, orderId: newOrderId, order: newOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    return res.status(200).json({ success: true, count: ORDERS_DB.length, orders: ORDERS_DB });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = ORDERS_DB.find(o => o.orderId === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = ORDERS_DB.find(o => o.orderId === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    if (req.io) {
      req.io.emit('order_status_changed', { orderId: order.orderId, status });
    }

    return res.status(200).json({ success: true, message: `Order #${order.orderId} updated to ${status}`, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
