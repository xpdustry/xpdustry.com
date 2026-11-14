import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { T, useGT } from "gt-tanstack-start";
import { PlinthButton, PlinthLink } from "#app/ui/Plinth";
import { ErrorPage } from "./ErrorPage";

export function RouteError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const gt = useGT();
  return (
    <ErrorPage
      code={500}
      message={gt("Something broke on our side")}
      details={<T>Try again in a moment. If it keeps happening, tell us on Discord.</T>}
      actions={
        <>
          <PlinthButton
            onClick={() => {
              reset();
              void router.invalidate();
            }}
          >
            <T>Try again</T>
          </PlinthButton>
          <PlinthLink tone="ink" to="/">
            <T>Home</T>
          </PlinthLink>
        </>
      }
    />
  );
}

export function RouteNotFound() {
  const gt = useGT();
  return (
    <>
      <meta name="description" content={gt("That page does not exist on the Xpdustry site.")} />
      <ErrorPage
        code={404}
        message={gt("Oh no, this page does not exist")}
        details={<T>Here's the way back.</T>}
        actions={
          <PlinthLink to="/">
            <T>Home</T>
          </PlinthLink>
        }
      />
    </>
  );
}
