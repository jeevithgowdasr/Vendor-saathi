export const setupOrderSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ [Socket.IO] New client connected: ${socket.id}`);

    // Join room (e.g. vendor room or customer order room)
    socket.on('join_order_room', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined room order_${orderId}`);
    });

    // Vendor accepts or updates order status
    socket.on('update_order_status', ({ orderId, status }) => {
      console.log(`📱 Vendor updated order #${orderId} to "${status}"`);
      io.emit('order_status_updated', { orderId, status, timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
