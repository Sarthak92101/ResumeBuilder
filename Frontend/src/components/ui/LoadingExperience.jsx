import skillMirrorLogo from '../../assets/skillmirror-logo.png'

const LoadingExperience = ({ title = 'Loading SkillMirror', overlay = false }) => {
  const Element = overlay ? 'div' : 'main'

  return (
    <Element
      className={`loading-experience${overlay ? ' loading-experience--overlay' : ''}`}
      role='status'
      aria-live='polite'
      aria-label={title}
    >
      <img className='loading-experience__logo' src={skillMirrorLogo} alt='' aria-hidden='true' />
    </Element>
  )
}

export default LoadingExperience
