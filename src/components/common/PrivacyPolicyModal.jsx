import { useEffect } from 'react'
import Icon from './Icon'

// Mirrors https://avyamlabs.com/privacy-policy/ (last updated 04-Oct-2026).
// If the hosted policy changes, update the text below to match.
export const PRIVACY_POLICY_URL = 'https://avyamlabs.com/privacy-policy/'

const DATA_ROWS = [
  ['Students', "Name, class/grade, section, roll number, date of birth, profile photo, attendance records, test and exam results, homework assignments and submissions, leave requests"],
  ['Parents / guardians', "Name, relationship to student, mobile number, email address, leave requests submitted on a student's behalf"],
  ['Teachers / staff', 'Name, mobile number or email, role, classes handled, attendance marked, marks entered, study material and homework uploaded'],
  ['All users (technical)', 'Device model, operating system, app version, IP address, crash logs and basic usage data, used to keep the App working and secure'],
]

function H({ children }) {
  return <h3 className="text-sm font-black text-on-surface mt-5 mb-1.5">{children}</h3>
}
function P({ children }) {
  return <p className="text-xs leading-relaxed text-on-surface-variant font-medium mb-2">{children}</p>
}
function UL({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-1 mb-2">
      {items.map((t) => (
        <li key={t} className="text-xs leading-relaxed text-on-surface-variant font-medium">{t}</li>
      ))}
    </ul>
  )
}

export default function PrivacyPolicyModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Privacy Policy"
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-surface-container-lowest rounded-[24px] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-outline-variant/20">
          <div>
            <h2 className="text-base font-black text-on-surface">Privacy Policy</h2>
            <p className="text-[11px] font-semibold text-outline">Avyam Education · Last updated: 04-Oct-2026</p>
          </div>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface" aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          <P>
            Avyam Education ("the App", "we", "us") is a school management app provided by Avyam Labs, Gujarat, India. It helps
            schools and institutes record and share student attendance, test results, homework, study material and leave requests
            with teachers, students and parents.
          </P>

          <H>1. Who is responsible for your data</H>
          <P>
            The school or institute that registers you in the App ("the Institution / the Organization") decides what student data
            is entered and why. We provide the App and process that data on the Institution's behalf. For data we collect directly
            (such as app diagnostics), we are responsible for it ourselves. For questions about a student's records, please also
            contact the Institution.
          </P>

          <H>2. Information we collect</H>
          <div className="rounded-xl border border-outline-variant/30 overflow-hidden mb-2">
            {DATA_ROWS.map(([who, what]) => (
              <div key={who} className="grid grid-cols-3 gap-3 px-3 py-2 border-b last:border-b-0 border-outline-variant/20 text-xs">
                <span className="font-bold text-on-surface">{who}</span>
                <span className="col-span-2 text-on-surface-variant font-medium leading-relaxed">{what}</span>
              </div>
            ))}
          </div>
          <P>
            We do not collect your precise location, contacts, microphone recordings or SMS messages. The App asks for camera/file
            access only when you choose to upload a file.
          </P>

          <H>3. How we use information</H>
          <UL
            items={[
              'To create and manage accounts and let each user see only what their role allows',
              'To record and display attendance, results, homework, study material and leave requests',
              'To send notifications such as absence alerts, new homework and result announcements',
              'To provide support, fix bugs, and keep the App secure',
              'To comply with legal obligations',
            ]}
          />
          <P>We do not use student data for advertising, profiling, or behavioural tracking, and we do not sell personal data.</P>

          <H>4. Who can see the data</H>
          <UL
            items={[
              'Students see their own records.',
              'Parents see only the records of their own child.',
              'Teachers see only the classes and students assigned to them.',
              'Institution administrators can see records for their own Institution.',
              'Data from one Institution is not visible to another Institution.',
            ]}
          />

          <H>5. Children's privacy</H>
          <P>
            Many users of the App are under 18. The Institution is responsible for obtaining verifiable consent from a parent or
            guardian before a child's data is entered in the App. We do not show advertisements to children, do not track or monitor
            children's behaviour for commercial purposes, and do not allow children's data to be used for targeted marketing. A
            parent or guardian may contact us or the Institution at any time to review, correct or delete their child's data.
          </P>

          <H>6. Sharing of information</H>
          <P>We share data only with:</P>
          <UL
            items={[
              "The student's own Institution and its authorised users;",
              'Service providers that help us run the App, such as Firebase / Google Cloud (hosting, authentication, push notifications, crash reporting). They process data only on our instructions and under their own privacy terms: https://firebase.google.com/support/privacy;',
              'Authorities, where required by law or a valid legal order.',
            ]}
          />
          <P>The App does not contain third-party advertising.</P>

          <H>7. Data storage and security</H>
          <P>
            Data is transmitted over encrypted (HTTPS/TLS) connections and stored on secured servers located in India/Asia. Access is
            protected by login and role-based permissions. No system is completely secure, but we take reasonable safeguards to
            protect your information, and we will notify affected users and authorities where the law requires.
          </P>

          <H>8. Data retention</H>
          <P>
            We keep data while the Institution's account is active. When a student leaves or the Institution closes its account, data
            is deleted or anonymised within 90 days, unless the law requires us to keep it longer. Backups are removed within 30 days
            after that.
          </P>

          <H>9. Your rights and account deletion</H>
          <P>
            You may ask to access, correct, update or delete your personal data, or withdraw consent, as permitted under the Digital
            Personal Data Protection Act, 2023 and other applicable laws.
          </P>
          <UL
            items={[
              'In the App: Settings > Delete Account',
              'By email: contact@avyamlabs.com, with the subject "Delete my data". Please mention the user\'s name, Institution, and registered mobile number or email so we can verify the request.',
            ]}
          />
          <P>We respond within 30 days. Some records may need to be kept if required by law or by the Institution's legal obligations.</P>

          <H>10. Grievance officer</H>
          <P>
            Name: Kalp Panchal<br />
            Email: panchal_kalp@avyamlabs.com<br />
            Address: Gujarat, India<br />
            We aim to acknowledge complaints within 72 hours and resolve them within 30 days.
          </P>

          <H>11. Changes to this policy</H>
          <P>
            We may update this policy from time to time. The latest version will always be on this page with a new "Last updated" date.
            For significant changes we will notify users in the App.
          </P>

          <H>12. Contact us</H>
          <P>
            Avyam Labs<br />
            Email: contact@avyamlabs.com<br />
            Address: Gujarat, India
          </P>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-outline-variant/20">
          <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-primary hover:underline"
          >
            Open full page
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
