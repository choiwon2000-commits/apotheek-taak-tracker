// app/_components/SecurityInfo.tsx
// Inklapbaar beveiligings-uitlegblok, rechtsonderaan op de hoofdpagina.
// Gebruikt native <details> — geen client-JS nodig.
import { Icon } from './Icon';

export function SecurityInfo() {
  return (
    <div className="mt-xl flex justify-end">
      <details className="group w-full max-w-2xl rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-sm px-lg py-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-sm">
            <Icon name="lock" className="text-primary" />
            Hoe veilig is deze webpagina?
          </span>
          <Icon
            name="expand_more"
            className="text-secondary transition-transform group-open:rotate-180"
          />
        </summary>

        <div className="space-y-md border-t border-outline-variant px-lg py-md text-body-md text-on-surface-variant">
          <p>
            De takenlijst is een interne werkpagina van Apotheek Marne en is op
            meerdere manieren beveiligd:
          </p>

          <ul className="space-y-sm">
            <li>
              🔒 <strong className="text-on-surface">Alleen met inlogcode:</strong>{' '}
              je komt nergens op de pagina zonder de gezamenlijke inlogcode. Wie
              niet is ingelogd, wordt automatisch naar het inlogscherm gestuurd.
            </li>
            <li>
              🔐{' '}
              <strong className="text-on-surface">
                Versleutelde verbinding (https):
              </strong>{' '}
              al het verkeer tussen je apparaat en de pagina is versleuteld, net
              als bij internetbankieren.
            </li>
            <li>
              🛡️{' '}
              <strong className="text-on-surface">
                Bescherming tegen wachtwoord-raden:
              </strong>{' '}
              na een paar foute pogingen wordt verder proberen tijdelijk
              geblokkeerd, zodat niemand de code kan &quot;raden&quot; met een
              computer.
            </li>
            <li>
              🗄️ <strong className="text-on-surface">Gegevens zitten op slot:</strong>{' '}
              de gegevens (taken, personen, logs) zijn alleen bereikbaar via de
              ingelogde pagina zelf, niet rechtstreeks van buitenaf. Ze worden
              bewaard bij Supabase, een professionele en gangbare
              databaseleverancier.
            </li>
            <li>
              🧱{' '}
              <strong className="text-on-surface">
                Standaard beveiligingsmaatregelen
              </strong>{' '}
              tegen veelvoorkomende aanvallen (zoals het injecteren van
              schadelijke code of het &quot;inladen&quot; van de pagina in een
              andere site) staan aan.
            </li>
          </ul>

          <div>
            <p className="font-medium text-on-surface">Goed om te weten:</p>
            <ul className="mt-xs list-disc space-y-xs pl-5">
              <li>
                De inlogcode is gedeeld binnen het team. Deel hem niet
                daarbuiten. Vermoed je dat hij is uitgelekt? Geef het door, dan
                wordt hij gewijzigd.
              </li>
              <li>
                Log je werk bij op een gedeelde computer? Klik op{' '}
                <strong className="text-on-surface">Uitloggen</strong> als je
                weggaat.
              </li>
              <li>
                Dit is een werk-/takenlijst, geen medisch dossiersysteem. Zet er
                daarom geen privacygevoelige patiëntgegevens in (zoals namen van
                patiënten, BSN of medische details), gebruik het alleen voor de
                dagelijkse taken zelf.
              </li>
            </ul>
          </div>

          <p>
            Kortom: voor een interne takenlijst is de pagina goed beveiligd.
            Vragen? Neem contact op met de beheerder.
          </p>
        </div>
      </details>
    </div>
  );
}
