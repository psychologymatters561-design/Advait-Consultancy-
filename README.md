# Advait Consultancy - Enhanced Landing Page

## 🎯 Overview

A premium, high-performance landing page for Advait Consultancy featuring:
- **Hero Section** with parallax background and sequenced text animations
- **Scroll-Triggered Pin** with seamless headline transitions
- **Horizontal Scrolling Gallery** with cinematic card animations
- **Services Showcase** with hover effects and stagger animations
- **Professional UI/UX** with luxury color scheme and smooth interactions

## ✨ Key Features

### 1. Hero Section
- Full-screen hero with high-quality background image
- Parallax effect that starts on page load
- Scroll-triggered pin that locks the section temporarily
- Sequential headline animations with smooth transitions
- Dual CTA buttons with hover effects
- Animated scroll indicator

### 2. Horizontal Scroll Gallery
- Cinematic horizontal scrolling triggered by page scroll
- Gallery cards with parallax image effects
- Smooth transitions between content cards
- Project metadata (number, title, description, year)
- Tags and categorization system

### 3. Services Section
- Grid of service cards with hover animations
- Icon-based service representation
- Scroll-triggered fade-in animations
- Responsive grid layout
- Professional service descriptions

### 4. Navigation & Footer
- Fixed navigation with smooth scroll links
- Interactive navbar with hover effects
- Multi-column footer with organized links
- Consistent branding throughout

## 🚀 Technologies Used

- **GSAP 3.12.5** - Advanced animations and timeline control
- **ScrollTrigger** - Scroll-based animation triggers
- **Lenis** - Smooth scroll implementation
- **CSS3** - Custom properties, gradients, and transitions
- **Vanilla JavaScript** - No framework dependencies

## 📁 File Structure

```
├── index.html           # Main HTML file
├── js/
│   └── animations.js    # Advanced animation system
└── README.md           # Documentation
```

## 🎨 Color Scheme

- **Background**: `#0a0e27` (Deep dark blue)
- **Light Background**: `#1a1f3a` (Slightly lighter blue)
- **Text**: `#f5f1ed` (Warm off-white)
- **Accent**: `#d4a574` (Gold)
- **Accent Bright**: `#e8b88d` (Light gold)
- **Primary**: `#2d5a7b` (Professional blue)

## 🎬 Animation Details

### Hero Animations
1. **Initial Load Parallax**: Background scales from 1.05 to 1 over 2.8 seconds
2. **Continuous Parallax**: 25% vertical movement during scroll
3. **Text Sequence**:
   - Headline 1 fades out and slides up
   - Headline 2 fades in with smooth transition
   - Headline 2 fades out and slides up
   - Headline 3 fades in with final message

### Horizontal Scroll
- Triggered when user scrolls past hero section
- Cards move laterally across screen
- Individual parallax effect on card images
- Staggered fade-in effect for cards
- Hover animations on card interaction

### Scroll Triggers
- Hero section pins for 400% of viewport height
- Horizontal gallery pins while scrolling
- Services cards fade in on scroll
- Navigation effects on scroll position

## 💻 Performance Optimizations

- Lazy loading for images
- CSS will-change properties for smooth animations
- RequestAnimationFrame optimization with Lenis
- ScrollTrigger invalidation on resize
- Reduced motion support for accessibility
- Viewport-based animation throttling

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 768px, 1024px
- Touch-optimized interactions
- Adjusted animation durations for mobile
- Flexible grid layouts
- Optimized button sizing

## 🔧 Usage

1. Replace image URLs with your own assets
2. Update service descriptions and portfolio items
3. Customize colors in CSS root variables
4. Modify animation timings in `animations.js`
5. Update navigation links to your pages

## 🎯 Customization Guide

### Change Colors
Edit `:root` variables in the `<style>` tag:
```css
:root {
    --bg: #0a0e27;
    --accent: #d4a574;
    /* ... more colors */
}
```

### Adjust Animation Speed
In `animations.js`, modify:
```javascript
const lenis = new Lenis({
    lerp: 0.08,        // Scroll smoothness
    duration: 1.2      // Animation duration
});
```

### Control Parallax Effect
```javascript
gsap.to('.hero-bg', {
    yPercent: 25,      // Change this value
    scrub: 1.2         // Adjust scrub speed
});
```

## 📊 Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile browsers: iOS Safari 14+, Chrome Mobile

## 🚨 Known Limitations

- Horizontal scroll may need adjustment on very wide screens
- Animation performance depends on device GPU capabilities
- Some mobile devices may have reduced animation complexity

## 🔗 External Libraries

- GSAP: https://greensock.com/gsap/
- Lenis: https://github.com/studio-freight/lenis
- Google Fonts: https://fonts.google.com/

## 📝 License

Ready for customization and deployment.

## 💡 Tips

1. **Images**: Use high-quality, optimized images for best visual impact
2. **Content**: Keep headlines concise and impactful
3. **CTAs**: Test button text to maximize conversions
4. **Mobile**: Always test on actual devices
5. **Analytics**: Add tracking to measure user engagement

## 🆘 Troubleshooting

**Animations not working?**
- Check browser console for errors
- Ensure GSAP and Lenis libraries are loaded
- Try `window.advaitAnimations.refreshScrollTrigger()`

**Horizontal scroll not smooth?**
- Adjust Lenis `lerp` value (lower = smoother)
- Check for background videos or heavy images
- Test on different devices

**Performance issues?**
- Reduce animation complexity on mobile
- Optimize image sizes
- Disable parallax on low-end devices

---

**Built with ❤️ for Advait Consultancy**