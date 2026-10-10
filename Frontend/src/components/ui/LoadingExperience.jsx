import React from 'react'

const LoadingExperience = ({
  title = 'Getting your workspace ready',
  detail = 'Setting up your interview preparation space.',
}) => (
  <main className='loading-experience' role='status' aria-live='polite' aria-label={title}>
    <section className='loading-experience__card'>
      <div className='loading-experience__brand'>
        <span className='loading-experience__mark' aria-hidden='true'>SM</span>
        <span>SkillMirror</span>
      </div>

      <div className='loading-experience__visual' aria-hidden='true'>
        <span className='loading-experience__orbit loading-experience__orbit--outer' />
        <span className='loading-experience__orbit loading-experience__orbit--inner' />
        <span className='loading-experience__spark loading-experience__spark--one' />
        <span className='loading-experience__spark loading-experience__spark--two' />
        <div className='loading-experience__document'>
          <span />
          <span />
          <span />
          <i />
        </div>
      </div>

      <div className='loading-experience__copy'>
        <span className='loading-experience__eyebrow'>A little prep goes a long way</span>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>

      <div className='loading-experience__steps' aria-hidden='true'>
        <span className='loading-experience__step loading-experience__step--active'>Your profile</span>
        <i />
        <span className='loading-experience__step'>Your next move</span>
        <i />
        <span className='loading-experience__step'>Ready to practice</span>
      </div>
    </section>
  </main>
)

export default LoadingExperience
