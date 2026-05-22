import { useState } from "react";
import Button from "../common/Button";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");

  return (
    <section className="ticketor-container py-[64px]">
      <div className="rounded-card border border-app-border bg-app-surface p-[48px] text-center">
        <h2 className="type-h2 text-app-text">Ready to watch & Book Movies?</h2>

        <p className="type-body-m mx-auto mt-[12px] max-w-[560px] text-app-text-muted">
          Subscribe to our newsletter. Enter your email to create or restart your
          membership.
        </p>

        <form
          className="mx-auto mt-[32px] flex max-w-[520px] gap-[12px]"
          onSubmit={(event) => {
            event.preventDefault();
            alert(`Subscribed: ${email}`);
          }}
        >
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            type="email"
            required
            className="h-[48px] min-w-0 flex-1 rounded-input border border-app-border bg-app-background px-[16px] type-body-m text-app-text outline-none placeholder:text-app-text-muted focus:border-brand"
          />

          <Button size={48} variant="primary" type="submit">
            Sign Up
          </Button>
        </form>

        <p className="type-body-xs mx-auto mt-[16px] max-w-[520px] text-app-text-muted">
          By clicking Sign Up you are confirming that you agree with our Terms
          and Conditions.
        </p>
      </div>
    </section>
  );
}