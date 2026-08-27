'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Does the AI sound robotic?",
    answer: "Not at all. RebookRelay is powered by CALL-E, which uses state-of-the-art voice models that sound naturally conversational, complete with pauses and empathetic tones."
  },
  {
    question: "What if a client gets upset?",
    answer: "The AI is programmed to handle objections gracefully and maintain a highly professional, apologetic tone. If a conversation escalates, it can gracefully end the call and notify staff."
  },
  {
    question: "How does it connect to my calendar?",
    answer: "We support integrations with Google Calendar, Outlook, and major booking platforms. RebookRelay securely reads availability and writes confirmed appointments back in real-time."
  },
  {
    question: "Can I manually trigger a recovery call?",
    answer: "Yes! While automatic detection is the default, your staff dashboard includes a 1-click manual trigger to launch a cascade for any missed appointment."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 px-6" id="faq">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold mb-16 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-800 bg-slate-900/30 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-lg font-medium">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === idx ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="text-slate-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5 text-slate-400 border-t border-slate-800 pt-4 mt-2">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
