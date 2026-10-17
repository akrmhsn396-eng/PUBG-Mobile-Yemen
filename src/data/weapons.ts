export interface WeaponConfig {
  id: string;
  level: number;
  nameAr: string;
  nameEn: string;
  caliber: string;
  magazineSize: number;
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // Seconds between shots
  speed: number;
  reloadTime: number;
  color: number;
  colorCss: string;
  spread: number;
  projectilesCount: number;
  isSniper?: boolean;
  isExplosive?: boolean;
  cost: number;
  descriptionAr: string;
}

export const WEAPON_UPGRADES: WeaponConfig[] = [
  {
    id: 'm416',
    level: 1,
    nameAr: 'بندقية M416 التكتيكية',
    nameEn: 'M416 Tactical AR',
    caliber: '5.56mm NATO',
    magazineSize: 30,
    damage: 34,
    headshotMultiplier: 2.2,
    fireRate: 0.1,
    speed: 95,
    reloadTime: 1.8,
    color: 0x38bdf8,
    colorCss: '#38bdf8',
    spread: 0.025,
    projectilesCount: 1,
    cost: 0,
    descriptionAr: 'البندقية الهجومية الأكثر شهرة وتوازناً في بوبجي، تجمع بين دقة التصويب وسرعة الإطلاق والاستقرار العالي.',
  },
  {
    id: 'akm',
    level: 2,
    nameAr: 'سلاح AKM الروسي الثقيل',
    nameEn: 'AKM Heavy Assault',
    caliber: '7.62mm Soviet',
    magazineSize: 30,
    damage: 48,
    headshotMultiplier: 2.4,
    fireRate: 0.13,
    speed: 88,
    reloadTime: 2.1,
    color: 0xf59e0b,
    colorCss: '#f59e0b',
    spread: 0.04,
    projectilesCount: 1,
    cost: 350,
    descriptionAr: 'سلاح الكلاشينكوف الجبار بقوة نارية مدمرة لتمزيق دروع المشاة ودبابات العدو من المسافات القريبة والمتوسطة.',
  },
  {
    id: 'awm',
    level: 3,
    nameAr: 'قناصة AWM الأسطورية (الإسقاط الجوي)',
    nameEn: 'AWM Magnum Sniper',
    caliber: '.300 Magnum',
    magazineSize: 5,
    damage: 160,
    headshotMultiplier: 3.0,
    fireRate: 0.75,
    speed: 150,
    reloadTime: 2.8,
    isSniper: true,
    color: 0x10b981,
    colorCss: '#10b981',
    spread: 0.001,
    projectilesCount: 1,
    cost: 800,
    descriptionAr: 'قناصة الدروب الأقوى في تاريخ بوبجي، قادرة على القضاء على أعتى الجنود وإسقاط خوذة لفل 3 بطلقة واحدة من مسافات شاسعة.',
  },
  {
    id: 'm249',
    level: 4,
    nameAr: 'رشاش البيكيسي M249 الثقيل',
    nameEn: 'M249 Squad Machine Gun',
    caliber: '5.56mm High Velocity',
    magazineSize: 100,
    damage: 42,
    headshotMultiplier: 2.0,
    fireRate: 0.075,
    speed: 98,
    reloadTime: 3.5,
    color: 0xff0055,
    colorCss: '#ff0055',
    spread: 0.06,
    projectilesCount: 1,
    cost: 1350,
    descriptionAr: 'سلاح الدعم الناري الثقيل بمخزن 100 طلقة لتدمير أرتال الدبابات وإمطار ساحة المعركة بوابل ناري لا يتوقف.',
  },
  {
    id: 'rpg_launcher',
    level: 5,
    nameAr: 'قاذف الصواريخ RPG-7 الخارق للدروع',
    nameEn: 'RPG-7 Rocket Launcher',
    caliber: '85mm Warhead',
    magazineSize: 3,
    damage: 240,
    headshotMultiplier: 1.5,
    fireRate: 0.85,
    speed: 70,
    reloadTime: 3.0,
    isExplosive: true,
    color: 0xa855f7,
    colorCss: '#a855f7',
    spread: 0.02,
    projectilesCount: 1,
    cost: 2100,
    descriptionAr: 'القاذف الصاروخي الخارق المخصص لسحق أعتى الدبابات وتفجير المدرعات وإحداث دمار شامل في محيط الاصطدام.',
  },
];
