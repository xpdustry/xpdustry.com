import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { Message } from "#app/components/site/Message";
import { PlinthButton, PlinthLink } from "#app/components/ui/Plinth";

export function ErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <Message code="500" title="Something broke on our side">
      <p>Try again in a moment. If it keeps happening, tell us on Discord.</p>
      <div>
        <PlinthButton
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          Try again
        </PlinthButton>
        <PlinthLink tone="ink" to="/">
          Home
        </PlinthLink>
      </div>
    </Message>
  );
}
