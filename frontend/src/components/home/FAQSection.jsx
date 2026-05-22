import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";
import { faqs } from "./homeData";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="ticketor-container py-[64px]">
      <div className="mb-[32px] text-center">
        <h2 className="type-h3 text-app-text">Frequently Asked Questions</h2>
        <p className="type-body-m mt-[8px] text-app-text-muted">
          Find answers to the most common questions quickly and easily.
        </p>
      </div>

      <div className="mx-auto max-w-[760px] space-y-[12px]">
        {faqs.map((faq, index) => {
          const open = openIndex === index;

          return (
            <div
              key={faq.question}
              className="rounded-tk-8 border border-app-border bg-app-background"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="flex w-full items-center justify-between px-[24px] py-[16px] text-left"
              >
                <span className="type-body-m text-app-text">
                  {faq.question}
                </span>

                <ChevronDown
                  className={cn(
                    "h-[20px] w-[20px] text-app-text-muted transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>

              {open && (
                <p className="type-body-s px-[24px] pb-[16px] text-app-text-muted">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-[32px] text-center">
        <p className="type-body-m text-app-text">Still have a question?</p>
        <p className="type-body-s mt-[4px] text-app-text-muted">
          Please contact us.
        </p>

        <Button size={40} variant="primary" className="mt-[16px]">
          Contact Us
        </Button>
      </div>
    </section>
  );
}