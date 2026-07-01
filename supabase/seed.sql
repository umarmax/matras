-- Запустите в Supabase SQL Editor после schema.sql

insert into public.products (
  name,
  description,
  price,
  category,
  width_options,
  length_options,
  rigidity
) values
(
  'Ortho Premium',
  'Ортопедический матрас с независимым пружинным блоком. Идеален для пар с разным весом.',
  28900,
  'orthopedic',
  array[80, 90, 120, 140, 160, 180, 200],
  array[190, 195, 200],
  'medium'
),
(
  'Spring Classic',
  'Классический пружинный матрас с комфортным верхним слоем.',
  19900,
  'spring',
  array[90, 120, 140, 160, 180],
  array[190, 200],
  'medium'
),
(
  'Foam Cloud',
  'Беспружинный матрас с эффектом памяти формы. Мягкое погружение.',
  24900,
  'foam',
  array[90, 120, 140, 160, 180, 200],
  array[190, 195, 200],
  'soft'
),
(
  'Kids Safe',
  'Гипоаллергенный детский матрас с усиленной поддержкой.',
  14900,
  'kids',
  array[60, 70, 80, 90],
  array[120, 140, 160, 190],
  'medium'
),
(
  'Custom Luxe',
  'Матрас на заказ любого размера. Изготовление за 2 дня.',
  34900,
  'custom',
  array[80, 90, 100, 120, 140, 160, 180, 200, 220],
  array[180, 190, 195, 200, 210],
  'hard'
);
