# Публикация на GitHub Pages

1. Распакуйте архив в отдельную папку. Файл index.html должен находиться в её корне, рядом с assets.
2. Загрузите в ваш репозиторий именно файлы и папки из распакованного архива. Не загружайте ZIP вместо сайта. Не оставляйте index.html внутри лишней папки 2cakes-studio.
3. В Settings → Pages выберите Deploy from a branch, затем нужную ветку (обычно main) и /(root), нажмите Save.
4. Дождитесь успешного задания Pages в Actions. Открывайте адрес из Settings → Pages → Visit site, а не страницу репозитория.
5. Файл .nojekyll уже включён. Он разрешает отдавать готовые статические файлы без обработки Jekyll.

Пути к стилям, скриптам и изображениям относительные, поэтому страница рассчитана и на адрес вида https://USERNAME.github.io/REPOSITORY/. Обязательно загрузите всю assets с сохранением структуры и регистра имён.

Если бесплатный GitHub Pages недоступен для приватного репозитория, нужен доступный вашему тарифу режим публикации. Если выбран источник GitHub Actions, для него требуется workflow; этот архив рассчитан на Deploy from a branch. Не путайте неисправность публикации с недоступностью внешней карты или Instagram.

Для SEO укажите полный адрес публикации, включая имя репозитория: инструкция в SEO-GEO.md. Скрипт configure-domain.ps1 изменяет только локальные файлы.

Источник: [GitHub — создание сайта Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [настройка источника публикации](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
