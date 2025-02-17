const coupons = [
	{
		"title": "金田屋大福飲品買一送一",
		"txt": "金田屋大福飲品買一送一，限定活動，快來搶購！",
		"date": "02/24 開始",
		"href": "https://supertaste.tvbs.com.tw/food/353033"
	},
	{
		"title": "金田屋大福飲品，限定日期買一送一",
		"txt": "金田屋大福飲品，買一送一，限定日期，不要錯過！",
		"date": "02/24 開始",
		"href": "https://supertaste.tvbs.com.tw/food/353033",
		"img": "https://linsly-achang.github.io/supertaste-public/IMG_3888.jpg"
	},
	{
		"cover": "https://linsly-achang.github.io/supertaste-public/%E5%84%AA%E6%83%A0%E5%88%B8_0212.png",
		"title": "金田屋大福飲品，限定日期買一送一",
		"href": "https://supertaste.tvbs.com.tw/food/353033"
	}
];


document.addEventListener('DOMContentLoaded', () => {
	// 		fetch('https://ads.achang.tw/super-coupon.json').then(res => res.json()).then(data => console.log(data));

	const promises = Array.from(document.querySelectorAll('.supertaste-coupon .coupon-list')).map(container => {
		return new Promise(resolve => {
			container.innerHTML = coupons.map(coupon => {
				if(coupon.cover) {
					return `<div class="coupon-item splide__slide">
						<div class="coupon-item-wrap">
							<div><a href="${coupon.href}" target="_blank"><img src="${coupon.cover}" alt="${coupon.title}"></a></div>
						</div>
					</div>`
				} else {
					const img = coupon.img;
					coupon = `<div class="coupon-item splide__slide">
						<div class="coupon-item-wrap">` + 
							(img ? `<div class="coupon-item-img" style="background-image:url(${img})"></div>` : '') +
							`<div class="coupon-item-content">
								<div><a href="${coupon.href}" target="_blank">${coupon.title}</a></div>
								<div>${coupon.txt}</div>
								<div>${coupon.date}</div>
							</div>
						</div>
					</div>`;
				}

				return coupon;
			}).join('');
			resolve();
		});
	});

	Promise.all(promises).then(() => {
		if(!window.Splide) {
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js';
			document.body.appendChild(script);

			const style = document.createElement('link');
			style.rel = 'stylesheet';
			style.href = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css';
			document.head.appendChild(style);

			script.onload = async () => {
				await new Promise(resolve => setTimeout(resolve, 1000));

				new Splide('.supertaste-coupon', {
					type: 'loop',
					autoplay: true,
					interval: 3000,
					pagination: false,
					arrows: false,
					perPage: 1,
					height: 105,
					gap: 16,
					// breakpoints: {
					// 	480: {
					// 		perPage: 1,
					// 	},
					// },
				}).mount();
			}
		}
	});
});
