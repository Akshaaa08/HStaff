import React, {useState} from 'react';
import {Pressable, ScrollView, View, useWindowDimensions} from 'react-native';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {ArrowRight, Quote, Star} from 'lucide-react-native';
import {colors, shadows} from '../theme';
import {Aurora} from './motion';
import {HStaffLogo} from './primitives';
import {ErrorText, Eyebrow, Outline, Primary, Quiet, TextArea, Txt, WrapChip, IconButton} from './ui';

type Review = {name: string; place: string; text: string; rating: number};
const seed: Review[] = [
  {name: 'Meera K.', place: 'Kothrud, Pune', rating: 5, text: 'Sunita made our flat spotless before Diwali. I chose her myself and the price was exactly what the app showed.'},
  {name: 'Arjun D.', place: 'Andheri, Mumbai', rating: 5, text: 'The electrician arrived on time and the Start code gave me real peace of mind.'},
  {name: 'Rahul S.', place: 'Helper, Pune', rating: 5, text: 'I pick the jobs I want and get paid to my UPI the same day. Proper respect for our work.'},
];

function Stars({n, size}: {n: number; size: number}) {
  return (
    <View style={{flexDirection: 'row', gap: 2, marginBottom: 8}} accessibilityLabel={`${n} out of 5`}>
      {Array.from({length: 5}, (_, s) => (
        <Star key={s} size={size} color={s < n ? colors.coral : colors.border} fill={s < n ? colors.coral : 'none'} />
      ))}
    </View>
  );
}

export function Testimonials({author}: {author: string}) {
  const {width} = useWindowDimensions();
  const cardW = (width - 48) * 0.82;
  const [list, setList] = useState(seed);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const publish = () => {
    if (rating === 0) return setErr('Please choose a rating.');
    if (text.trim().length < 10) return setErr('Please write at least 10 characters.');
    setList(l => [{name: author, place: 'Just now', text: text.trim().slice(0, 300), rating}, ...l]);
    setText(''); setRating(0); setErr(''); setOpen(false);
  };
  return (
    <View style={{marginTop: 34, marginBottom: 10}}>
      <Eyebrow>Loved across Maharashtra</Eyebrow>
      <Txt size={24} w="extrabold" lh={1.2} style={{marginTop: 6, marginBottom: 16}} accessibilityRole="header">Kind words from our community</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardW + 12} decelerationRate="fast" style={{marginHorizontal: -24}} contentContainerStyle={{paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16, gap: 12}}>
        {list.map((r, i) => (
          <LinearGradient key={r.name + i} colors={[colors.background, '#FFEFE8']} start={{x: 0, y: 0}} end={{x: 0.4, y: 1}}
            style={[{width: cardW, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border}, shadows.card]}>
            <Quote size={28} color={colors.pink} />
            <Txt size={14} lh={1.65} style={{marginTop: 8, marginBottom: 12}}>{r.text}</Txt>
            <Stars n={r.rating} size={14} />
            <Txt size={13} w="bold">{r.name}</Txt>
            <Txt size={11} color={colors.mutedForeground}>{r.place}</Txt>
          </LinearGradient>
        ))}
      </ScrollView>
      {open ? (
        <View style={{marginTop: 8}}>
          <View style={{flexDirection: 'row', gap: 2, marginBottom: 8}} accessibilityRole="radiogroup">
            {Array.from({length: 5}, (_, s) => (
              <IconButton key={s} label={`${s + 1} stars`} onPress={() => setRating(s + 1)}>
                <Star size={24} color={s < rating ? colors.coral : colors.border} fill={s < rating ? colors.coral : 'none'} />
              </IconButton>
            ))}
          </View>
          <TextArea rows={3} maxLength={300} accessibilityLabel="Your review" placeholder="Tell others about your experience" value={text} onChangeText={setText} />
          {!!err && <ErrorText>{err}</ErrorText>}
          <Primary title="Publish review" icon={<ArrowRight size={16} color="#fff" />} onPress={publish} />
        </View>
      ) : (
        <Outline title="Write a review" onPress={() => setOpen(true)} mt={0} />
      )}
    </View>
  );
}

/** Brand glyphs (lucide v1 dropped brand icons, so the classic outlines are inlined). */
function Social({name}: {name: 'X' | 'Instagram' | 'LinkedIn' | 'Facebook'}) {
  const p = {stroke: colors.primaryForeground, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      {name === 'X' && <Path {...p} d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />}
      {name === 'Facebook' && <Path {...p} d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />}
      {name === 'Instagram' && (
        <>
          <Rect {...p} x={2} y={2} width={20} height={20} rx={5} ry={5} />
          <Path {...p} d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <Path {...p} d="M17.5 6.5h.01" />
        </>
      )}
      {name === 'LinkedIn' && (
        <>
          <Path {...p} d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <Rect {...p} x={2} y={9} width={4} height={12} />
          <Circle {...p} cx={4} cy={4} r={2} />
        </>
      )}
    </Svg>
  );
}

export function AppFooter({links, onCta, cta}: {links: {label: string; onClick: () => void}[]; onCta: () => void; cta: string}) {
  return (
    <Aurora colorsList={['#FFE8DE', colors.coral, colors.softPink]} duration={14000} style={{marginTop: 30, marginHorizontal: -24, marginBottom: -24}}>
      <View style={{paddingTop: 34, paddingHorizontal: 24, overflow: 'hidden'}}>
        <HStaffLogo />
        <Txt size={14} lh={1.6} style={{marginTop: 10, maxWidth: 300}}>Trusted local help for homes and businesses — verified people, transparent prices.</Txt>
        <View style={{flexDirection: 'row', gap: 12, marginTop: 22, marginBottom: 28}}>
          {(['X', 'Instagram', 'LinkedIn', 'Facebook'] as const).map(l => (
            <Pressable key={l} accessibilityRole="link" accessibilityLabel={l} style={{width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary}}>
              <Social name={l} />
            </Pressable>
          ))}
        </View>
        <Txt size={17} color={colors.mutedForeground}>Explore</Txt>
        <View style={{marginTop: 6, marginBottom: 20, alignItems: 'flex-start'}}>
          {links.map(l => (
            <Pressable key={l.label} accessibilityRole="button" onPress={l.onClick} style={{minHeight: 44, justifyContent: 'center'}}>
              <Txt size={15} w="medium">{l.label}</Txt>
            </Pressable>
          ))}
        </View>
        <Primary title={cta} full={false} onPress={onCta} style={{alignSelf: 'flex-start', paddingHorizontal: 28}} />
        <Txt size={12} style={{marginTop: 26}}>H-Staff® · Made with care in Pune · © 2026</Txt>
        <Txt size={92} w="extrabold" accessibilityElementsHidden importantForAccessibility="no" style={{width: 520, letterSpacing: -3.7, lineHeight: 92, marginTop: 18, marginLeft: -6, marginBottom: -14, color: colors.primary}}>H-Staff</Txt>
      </View>
    </Aurora>
  );
}

const topics = {
  customer: ['Professional didn’t arrive', 'Poor quality of work', 'Behaviour or safety concern', 'Overcharged / payment issue', 'Damage to property', 'Other'],
  professional: ['Customer unavailable at address', 'Unsafe working conditions', 'Payment not received', 'Abusive behaviour', 'Job scope changed', 'Other'],
};
export function ComplaintForm({persona, onDone}: {persona: 'customer' | 'professional'; onDone: (id: string) => void}) {
  const [topic, setTopic] = useState('');
  const [detail, setDetail] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!topic) return setErr('Please choose a topic.');
    if (detail.trim().length < 15) return setErr('Please add a few more details (15+ characters).');
    onDone('HS-' + String(Date.now()).slice(-6));
  };
  return (
    <View>
      <Txt size={12} color={colors.mutedForeground} lh={1.7}>Tell us what went wrong. Our safety team reviews every complaint within 24 hours.</Txt>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14}}>
        {topics[persona].map(t => <WrapChip key={t} title={t} selected={topic === t} onPress={() => setTopic(t)} />)}
      </View>
      <TextArea rows={4} maxLength={500} accessibilityLabel="Complaint details" placeholder="Describe what happened, with booking date if possible" value={detail} onChangeText={setDetail} style={{marginTop: 12}} />
      {!!err && <ErrorText>{err}</ErrorText>}
      <Primary title="Submit complaint" onPress={submit} />
    </View>
  );
}
export {Quiet};
