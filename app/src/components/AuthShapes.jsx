import { motion } from "framer-motion";

export default function AuthShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">

      {/* Large sphere — top left */}
      <motion.div
        animate={{ y: [0, -18, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-80px",
          left: "-60px",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #ff6a35, #c43a10 55%, #7a1e06 100%)",
          boxShadow: "inset -20px -20px 40px rgba(0,0,0,0.5), 0 20px 60px rgba(200,60,10,0.4)",
        }}
      />

      {/* Floating ring — top right */}
      <motion.div
        animate={{ rotate: [0, 360], y: [0, 12, 0] }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
        style={{
          position: "absolute",
          top: "8%",
          right: "6%",
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "18px solid transparent",
          borderTopColor: "#E84B1D",
          borderRightColor: "#c43a10",
          borderBottomColor: "rgba(232,75,29,0.4)",
          boxShadow: "0 0 30px rgba(232,75,29,0.3), inset 0 0 20px rgba(232,75,29,0.1)",
        }}
      />

      {/* Cube — upper right area */}
      <motion.div
        animate={{ rotate: [15, 55, 15], y: [0, -14, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{
          position: "absolute",
          top: "22%",
          right: "14%",
          width: 54,
          height: 54,
          borderRadius: "10px",
          background: "linear-gradient(135deg, #E84B1D, #7a1e06)",
          boxShadow: "6px 8px 20px rgba(0,0,0,0.5), -2px -2px 10px rgba(255,120,60,0.25), inset 2px 2px 6px rgba(255,180,100,0.2)",
          transform: "rotate(20deg)",
        }}
      />

      {/* Medium sphere — right middle */}
      <motion.div
        animate={{ y: [0, 22, 0], x: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        style={{
          position: "absolute",
          top: "42%",
          right: "-30px",
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle at 30% 30%, #ff7043, #b53010 60%, #6b1a05 100%)",
          boxShadow: "inset -12px -12px 30px rgba(0,0,0,0.5), 0 10px 40px rgba(200,60,10,0.3)",
        }}
      />

      {/* Flat ring — bottom right */}
      <motion.div
        animate={{ rotate: [0, -360] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          bottom: "8%",
          right: "8%",
          width: 90,
          height: 90,
          borderRadius: "50%",
          border: "14px solid rgba(232,75,29,0.5)",
          boxShadow: "0 0 20px rgba(232,75,29,0.25)",
        }}
      />

      {/* Small cube — bottom left */}
      <motion.div
        animate={{ rotate: [0, 80, 0], y: [0, -12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute",
          bottom: "18%",
          left: "5%",
          width: 40,
          height: 40,
          borderRadius: "8px",
          background: "linear-gradient(135deg, #c43a10, #5a1200)",
          boxShadow: "4px 6px 16px rgba(0,0,0,0.5), inset 1px 1px 4px rgba(255,120,60,0.3)",
          transform: "rotate(30deg)",
        }}
      />

      {/* Large dark sphere — bottom left blob */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        style={{
          position: "absolute",
          bottom: "-60px",
          left: "-40px",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 40%, #E84B1D, #7a1e06 65%, #2d0800 100%)",
          boxShadow: "inset -15px -15px 30px rgba(0,0,0,0.6), 0 15px 50px rgba(180,50,10,0.35)",
        }}
      />

      {/* Tiny dot accent — center-right area */}
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.4, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          position: "absolute",
          top: "60%",
          right: "22%",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#E84B1D",
          boxShadow: "0 0 12px rgba(232,75,29,0.8)",
        }}
      />
    </div>
  );
}