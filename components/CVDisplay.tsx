'use client'

import { CVData } from '../data/base-cv'

interface Props {
  cv: CVData;
}

export default function CVDisplay({ cv }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Current CV</h2>
      
      <div className="space-y-4">
        <section>
          <h3 className="text-xl font-semibold">{cv.name}</h3>
          <p className="text-gray-600">{cv.contact}</p>
        </section>

        <section>
          <h3 className="font-semibold">Professional Summary</h3>
          <p>{cv.summary}</p>
        </section>

        <section>
          <h3 className="font-semibold">Skills</h3>
          <p>{cv.skills}</p>
        </section>

        <section>
          <h3 className="font-semibold">Professional Experience</h3>
          <p className="whitespace-pre-wrap">{cv.experience}</p>
        </section>

        <section>
          <h3 className="font-semibold">Education</h3>
          <p className="whitespace-pre-wrap">{cv.education}</p>
        </section>

        <section>
          <h3 className="font-semibold">Languages</h3>
          <p>{cv.languages}</p>
        </section>

        <section>
          <h3 className="font-semibold">Achievements</h3>
          <p>{cv.achievements}</p>
        </section>

        <section>
          <h3 className="font-semibold">Continuing Development</h3>
          <p>{cv.development}</p>
        </section>

        <section>
          <h3 className="font-semibold">Professional Memberships</h3>
          <p>{cv.memberships}</p>
        </section>
      </div>
    </div>
  )
}

