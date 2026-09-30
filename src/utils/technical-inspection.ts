function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== value) return null;

  return date;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date.getTime());
  const month = result.getUTCMonth();

  result.setUTCFullYear(result.getUTCFullYear() + years);

  // Le 29 février devient le 28 février si l'année cible
  // n'est pas bissextile.
  if (result.getUTCMonth() !== month) {
    result.setUTCDate(0);
  }

  return result;
}

export function calculateNextTechnicalInspectionDate(
  firstRegistrationDate: string,
  lastTechnicalInspectionDate: string,
): string {
  if (lastTechnicalInspectionDate) {
    const lastInspection = parseDate(lastTechnicalInspectionDate);
    if (!lastInspection) return '';

    return addYears(lastInspection, 2).toISOString().slice(0, 10);
  }

  const firstRegistration = parseDate(firstRegistrationDate);
  if (!firstRegistration) return '';

  const deadline = addYears(firstRegistration, 4);

  // Le premier contrôle doit être effectué avant
  // le quatrième anniversaire de la mise en circulation.
  deadline.setUTCDate(deadline.getUTCDate() - 1);

  return deadline.toISOString().slice(0, 10);
}

export function isValidDate(value: string): boolean {
  return parseDate(value) !== null;
}