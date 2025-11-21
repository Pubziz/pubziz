interface Pub {
  id: number;
  name: string
  address: string
  url: string
  items: PubItem[]
}

interface PubItem {
  id: number
  pubId: number
  name: string
  price: string
  description: string
  availability: string
  productUrl: string | null
  imageUrl: string | null
  attributes: string
  createdAt: string
  updatedAt: string
}
export type { Pub, PubItem };