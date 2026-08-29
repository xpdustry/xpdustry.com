import * as styles from "#app/components/layout/ReticulateField.css";

export function ReticulateField() {
  return (
    <div class={styles.field} data-reticulate aria-hidden="true">
      <div class={styles.net} />
    </div>
  );
}
