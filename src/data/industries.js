const industries = [
  {
    id: 'primary',
    title: 'Primary Sector',
    desc: 'Produce the raw resources that power entire economies.',
    icon: 'fa-solid fa-wheat-awn-circle-exclamation',
    includes: [
      { name: 'Farming', icon: 'fa-solid fa-seedling' },
      { name: 'Dairy', icon: 'fa-solid fa-cow' },
      { name: 'Mining', icon: 'fa-solid fa-mountain' }
    ]
  },
  {
    id: 'factories',
    title: 'Factories',
    desc: 'Transform raw materials into valuable products.',
    icon: 'fa-solid fa-screwdriver-wrench',
    includes: [
      { name: 'Garment Factory', icon: 'fa-solid fa-scissors' },
      { name: 'Food Processing', icon: 'fa-solid fa-utensils' },
      { name: 'Construction Factory', icon: 'fa-solid fa-trowel-bricks' }
    ]
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    desc: 'Build advanced products for global markets.',
    icon: 'fa-solid fa-microchip',
    includes: [
      { name: 'Automobile Manufacturing', icon: 'fa-solid fa-car-side' },
      { name: 'Electronics Manufacturing', icon: 'fa-solid fa-laptop-code' }
    ]
  },
  {
    id: 'retail',
    title: 'Retail',
    desc: 'Become the face of commerce and sell products directly.',
    icon: 'fa-solid fa-cart-shopping',
    includes: [
      { name: 'Clothing Store', icon: 'fa-solid fa-shirt' },
      { name: 'Electronics Store', icon: 'fa-solid fa-mobile-screen-button' },
      { name: 'Restaurant', icon: 'fa-solid fa-mug-hot' },
      { name: 'Car Showroom', icon: 'fa-solid fa-car' }
    ]
  }
];

export default industries;
