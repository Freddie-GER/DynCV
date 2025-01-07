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
          <div className="space-y-4">
            {cv.experience.map((position, index) => (
              <div key={index} className="pl-4 border-l-2 border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{position.title}</h4>
                    <p className="text-gray-600">{position.company}</p>
                    {position.location && (
                      <p className="text-gray-500 text-sm">{position.location}</p>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm whitespace-nowrap">
                    {position.startDate} - {position.endDate}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{position.description}</p>
              </div>
            ))}
          </div>
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

