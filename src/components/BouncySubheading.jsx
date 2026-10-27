import React from "react";
import { motion } from "framer-motion";

// Semi-bouncy subheading: each word springs in once, then rests.
export default function BouncySubheading({ text }) {
  return (
    <p className="font-heading text-xl md:text-2xl text-primary leading-tight mt-2 flex flex-wrap gap-x-2 select-none">
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 11, delay: 0.12 * i }}
          whileTap={{ y: -4 }}
          className="inline-block"
        >
          {w}
        </motion.span>
      ))}
    </p>
  );
}