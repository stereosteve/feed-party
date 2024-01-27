drop table if exists feeds;

create table if not exists feeds (
  url text primary key,
  who text
);

insert into feeds values
    ('https://andrewkelley.me/rss.xml', 'steve')
  , ('https://notes.eatonphil.com/rss.xml', 'steve')
  , ('https://justinjaffray.com/index.xml', 'steve')
;
