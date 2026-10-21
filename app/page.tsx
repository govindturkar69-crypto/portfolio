import { AmbientSparkles } from '@/components/descent/ambient-sparkles';
import { DescentController } from '@/components/descent/descent-controller';
import { LayerScene } from '@/components/descent/layer-scene';
import { SqlIntro } from '@/components/descent/sql-intro';
import { Surface } from '@/components/descent/surface';
import { AboutSection, ContactSection, IndexSection, StackSection } from '@/components/sections';
import { descent } from '@/data/descent';

export default function HomePage() {
  return (
    <>
      <SqlIntro />
      <div aria-hidden="true" className="descent-backdrop" />
      <AmbientSparkles />
      <DescentController />
      <div id="descent">
        <Surface />
        <div id="work">
          {descent.map((layer) => (
            <LayerScene key={layer.id} layer={layer} total={descent.length} />
          ))}
        </div>
      </div>
      <IndexSection />
      <StackSection />
      <AboutSection />
      <ContactSection />
    </>
  );
}
