# Public Directory Rules

## Asset Organization
- **Images**: Use descriptive filenames with proper extensions
- **Icons**: Prefer SVG format for scalability and performance
- **Documents**: PDF files for downloadable content
- **Static Assets**: Fonts, favicons, robots.txt, sitemap.xml

## File Naming Conventions
- Use kebab-case for all filenames (e.g., `user-avatar.png`, `company-logo.svg`)
- Include descriptive names, not generic terms
- Add dimensions to filename when relevant (e.g., `hero-image-1920x1080.jpg`)
- Use semantic names that indicate purpose (e.g., `icon-chevron-down.svg`)

## Image Optimization Guidelines
- **Format Selection**:
  - SVG: Icons, logos, simple graphics
  - WebP: Modern browsers, photos with transparency
  - PNG: Images with transparency, screenshots
  - JPEG: Photos without transparency
- **Size Optimization**: Compress images before adding to project
- **Multiple Resolutions**: Provide 1x, 2x, 3x versions for high-DPI displays

## SVG Best Practices
- Remove unnecessary metadata and comments
- Use consistent viewBox dimensions
- Include accessible titles and descriptions
- Optimize path data for smaller file sizes
- Use CSS classes for styling when possible

## Favicon Requirements
- `favicon.ico`: Traditional favicon (32x32, 16x16)
- `icon.svg`: Modern vector favicon
- Apple touch icons: 180x180 PNG
- Web app manifests: Various sizes (192x192, 512x512)

## Static File Guidelines
- `robots.txt`: Search engine crawling instructions
- `sitemap.xml`: Site structure for search engines
- `manifest.json`: PWA configuration
- `.well-known/`: Security and verification files

## Security Considerations
- Never store sensitive files in public directory
- All files are publicly accessible via URL
- Use appropriate file permissions
- Avoid uploading files with sensitive metadata

## Performance Best Practices
- Minimize file sizes through compression
- Use appropriate image formats
- Consider lazy loading for large images
- Leverage CDN for static asset delivery
- Implement proper caching headers

## Accessibility Standards
- Provide alt text information in consuming components
- Use descriptive filenames that indicate content
- Ensure sufficient color contrast in images
- Include text alternatives for informational images

## File Size Guidelines
- Icons: < 10KB each
- Photos: < 500KB (optimized)
- Documents: < 5MB
- Total public folder: Keep reasonable for deployment