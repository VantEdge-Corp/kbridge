import type { IconType } from 'react-icons';
import { LuBaby, LuBriefcase, LuCigarette, LuDumbbell, LuFlag, LuGraduationCap, LuLanguages, LuMapPin, LuRuler, LuSignpost, LuTag, LuUser, LuWine } from 'react-icons/lu';
import type { ProfileFact, ProfileFactKind } from '@peaches/core';
import { Badge } from '@/components/ui/badge';
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { RowGroup } from '@/components/SettingsRow';

/** The same Lucide glyph per fact on the web and on the phone. */
export const FACT_ICON: Record<ProfileFactKind, IconType> = {
  height: LuRuler,
  area: LuMapPin,
  intent: LuSignpost,
  children: LuBaby,
  drinking: LuWine,
  smoking: LuCigarette,
  exercise: LuDumbbell,
  work: LuBriefcase,
  education: LuGraduationCap,
  field: LuTag,
  nationality: LuFlag,
  languages: LuLanguages,
  ethnicity: LuUser,
};

/** Height, area, intent, and lifestyle as icon badges that wrap. */
export function VitalBadges({ facts }: { facts: ReadonlyArray<ProfileFact> }) {
  if (facts.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="At a glance">
      {facts.map((fact) => {
        const Icon = FACT_ICON[fact.kind];
        return (
          <li key={fact.kind}>
            <Badge variant="outline" className="h-8 gap-1.5 px-3 text-sm font-normal [&>svg]:size-4!" aria-label={`${fact.label}: ${fact.value}`}>
              <Icon className="text-muted-foreground" />
              {fact.value}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

/** Work, education, background: an icon and a readable phrase per row, no label column. */
export function DetailList({ facts }: { facts: ReadonlyArray<ProfileFact> }) {
  if (facts.length === 0) return null;
  return (
    <RowGroup>
      {facts.map((fact) => {
        const Icon = FACT_ICON[fact.kind];
        return (
          <Item key={fact.kind} className="rounded-none px-4 py-3" aria-label={`${fact.label}: ${fact.value}`}>
            <ItemMedia variant="icon" className="text-muted-foreground">
              <Icon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="font-normal">{fact.value}</ItemTitle>
            </ItemContent>
          </Item>
        );
      })}
    </RowGroup>
  );
}
