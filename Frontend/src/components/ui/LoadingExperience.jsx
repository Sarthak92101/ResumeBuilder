import skillMirrorLogo from '../../assets/skillmirror-logo.png'

const LoadingExperience = ({ title = 'Loading SkillMirror' }) => (
  <main className='loading-experience' role='status' aria-live='polite' aria-label={title}>
    <img className='loading-experience__logo' src={skillMirrorLogo} alt='' aria-hidden='true' />
  </main>
)

export default LoadingExperience
