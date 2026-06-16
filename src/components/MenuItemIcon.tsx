import { ForkKnife, Pizza, Hamburger, BeerStein, Cake, Bread, Coffee, BowlFood, BowlSteam, Popcorn, IceCream } from '@phosphor-icons/react'

const iconMap: Record<string, React.ElementType> = {
  ForkKnife,
  Pizza,
  Hamburger,
  Beer: BeerStein,
  Cake,
  Bread,
  Coffee,
  BowlFood,
  BowlSteam,
  Popcorn,
  IceCream,
}

export default function MenuItemIcon({ name, size = 24, color }: { name?: string | null; size?: number; color?: string }) {
  if (name && iconMap[name]) {
    const Icon = iconMap[name]
    return <Icon size={size} color={color} />
  }
  return <span style={{ fontSize: size }}>{'🍽️'}</span>
}
