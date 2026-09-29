import type { DrivingMode } from '../../models';

export interface DrivingModeOption {
  id: DrivingMode;
  label: string;
  icon: string;
  recommendations: readonly string[];
}

export const DRIVING_MODE_OPTIONS: readonly DrivingModeOption[] = [
  {
    id: 'comfort',
    label: 'Confort',
    icon: '🚗',
    recommendations: [
      'Adoptez une conduite souple et progressive.',
      'Privilégiez le confort des passagers.',
      'Respectez les contrôles d’entretien du véhicule.',
    ],
  },
  {
    id: 'sport',
    label: 'Sport',
    icon: '🏎️',
    recommendations: [
      'Gardez une conduite dynamique et maîtrisée.',
      'Surveillez la consommation et les distances de freinage.',
      'Vérifiez régulièrement les pneus et les freins.',
    ],
  },
  {
    id: 'eco',
    label: 'Éco',
    icon: '🌱',
    recommendations: [
      'Accélérez progressivement et gardez une vitesse régulière.',
      'Évitez les accélérations et freinages inutiles.',
      'Vérifiez régulièrement la pression des pneus.',
    ],
  },
  {
    id: 'rain',
    label: 'Pluie',
    icon: '🌧️',
    recommendations: [
      'Réduisez votre vitesse et augmentez les distances de sécurité.',
      'Anticipez les freinages sur une chaussée glissante.',
      'Vérifiez l’état des pneus et des essuie-glaces.',
    ],
  },
  {
    id: 'winter',
    label: 'Hiver',
    icon: '❄️',
    recommendations: [
      'Anticipez les freinages sur les routes glissantes.',
      'Vérifiez les équipements et pneus adaptés à la saison.',
      'Suivez les recommandations du constructeur du véhicule.',
    ],
  },
];

export function isDrivingMode(value: string | undefined): value is DrivingMode {
  return DRIVING_MODE_OPTIONS.some((option) => option.id === value);
}

export function getDrivingModeOption(mode: DrivingMode): DrivingModeOption {
  return DRIVING_MODE_OPTIONS.find((option) => option.id === mode) ?? DRIVING_MODE_OPTIONS[0]!;
}
