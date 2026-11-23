import { CardLibrary, type CardPack } from '@/kit/cards';
import { H1, Muted, Screen } from '@/kit/ui';
import raw from '@/content/cards.json';

const pack = raw as CardPack;

export default function Learn() {
  return (
    <Screen testID="learn">
      <H1>Your rights at work</H1>
      <Muted>Short, sourced cards. General information, not legal or tax advice.</Muted>
      <CardLibrary pack={pack} app="shiftledger" />
    </Screen>
  );
}
