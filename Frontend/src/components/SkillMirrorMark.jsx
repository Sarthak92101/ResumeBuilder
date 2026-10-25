import skillMirrorLogo from '../assets/skillmirror-logo.png'

const SkillMirrorMark = ({ className = "" }) => (
  <span className={`skillmirror-mark ${className}`.trim()} aria-hidden="true">
    <img src={skillMirrorLogo} alt="" />
  </span>
)

export default SkillMirrorMark
