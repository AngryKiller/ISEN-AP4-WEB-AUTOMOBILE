import type { DrivingMode, Vehicle } from '../../models';

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
    icon: '/icons/mode-confort.png',
    recommendations: [
      'Adoptez une conduite souple et progressive.',
      'Privilégiez le confort des passagers.',
      'Respectez les contrôles d’entretien du véhicule.',
    ],
  },
  {
    id: 'sport',
    label: 'Sport',
    icon: '/icons/mode-sport.png',
    recommendations: [
      'Gardez une conduite dynamique et maîtrisée.',
      'Surveillez la consommation et les distances de freinage.',
      'Vérifiez régulièrement les pneus et les freins.',
    ],
  },
  {
    id: 'eco',
    label: 'Éco',
    icon: '/icons/eco.png',
    recommendations: [
      'Accélérez progressivement et gardez une vitesse régulière.',
      'Évitez les accélérations et freinages inutiles.',
      'Vérifiez régulièrement la pression des pneus.',
    ],
  },
  {
    id: 'rain',
    label: 'Pluie',
    icon: '/icons/pluie.png',
    recommendations: [
      'Réduisez votre vitesse et augmentez les distances de sécurité.',
      'Anticipez les freinages sur une chaussée glissante.',
      'Vérifiez l’état des pneus et des essuie-glaces.',
    ],
  },
  {
    id: 'winter',
    label: 'Hiver',
    icon: '/icons/flocon-de-neige.png',
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

export function getDrivingModeOption(mode: DrivingMode, vehicle?: Vehicle): DrivingModeOption {
  const base = DRIVING_MODE_OPTIONS.find((option) => option.id === mode) ?? DRIVING_MODE_OPTIONS[0]!;
  if (!vehicle) return base;

  const recommendations = [...base.recommendations];

  if (mode === 'eco') {
    if (vehicle.fuel === 'electric') {
      recommendations.push("Activez la régénération d'énergie maximale au freinage.");
    } else if (vehicle.transmissionType?.startsWith('manual')) {
      recommendations.push('Passez les rapports supérieurs avant 2 000 tr/min.');
    } else if (vehicle.transmissionType) {
      recommendations.push('Privilégiez le roulage en roue libre (coasting).');
    }
    if (typeof vehicle.averageConsumption === 'number') {
      const unit = vehicle.fuel === 'electric' ? 'kWh/100 km' : 'L/100 km';
      const target = (vehicle.averageConsumption * 0.88).toFixed(1);
      recommendations.push(`Cible éco suggérée : ~${target} ${unit} (réf. ${vehicle.averageConsumption}).`);
    }
  } else if (mode === 'sport') {
    if (vehicle.driveType === 'rwd') {
      recommendations.push('Propulsion (RWD) : dosez les accélérations en sortie de virage.');
    } else if (vehicle.driveType === 'awd') {
      recommendations.push('Transmission intégrale : relances franches avec grip optimal.');
    }
  } else if (mode === 'rain' || mode === 'winter') {
    if (vehicle.driveType === 'rwd') {
      recommendations.push('Attention au train arrière sur chaussée glissante (propulsion).');
    } else if (vehicle.driveType === 'awd') {
      recommendations.push('Motricité 4x4 active, gardez néanmoins vos distances de freinage.');
    }
    if (typeof vehicle.wheelRimInches === 'number' && vehicle.wheelRimInches >= 19) {
      recommendations.push('Grandes jantes : vigilance accrue face aux nids-de-poule et à l’aquaplaning.');
    }
  }

  return {
    ...base,
    recommendations,
  };
}
