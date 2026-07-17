import * as React from 'react'

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
}

export interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const LogoIcon = ({ className, size = 'md', ...props }: LogoIconProps) => {
  const dimension = sizeMap[size]

  return (
    <svg
      className={className}
      fill="currentColor"
      height={dimension}
      viewBox="0 0 900 900"
      width={dimension}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(3942.88,-1347.89)">
        <g transform="matrix(0,22.5,-22.5,0,-3042.88,1347.89)">
          <path d="M30,28V12c0-1.105-0.895-2-2-2h-0.101c-0.53,0-1.039,0.211-1.414,0.586L10.586,26.485C10.211,26.86,10,27.369,10,27.899V40H0V27.899C0,24.717,1.264,21.665,3.515,19.414L19.414,3.515C21.665,1.264,24.717,0,27.899,0H28c6.627,0,12,5.373,12,12v16c0,6.627-5.373,12-12,12H14V30h14c1.105,0,2-0.895,2-2z" />
        </g>
      </g>
    </svg>
  )
}
