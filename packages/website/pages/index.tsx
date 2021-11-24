import type { NextPage } from 'next';
import README from 'raw-loader!../../../README.md';
import md from 'markdown-it';

const html = md().render(README);

const Home: NextPage = () => {
  return (
    <article
      className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl mx-auto mt-20"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Home;
