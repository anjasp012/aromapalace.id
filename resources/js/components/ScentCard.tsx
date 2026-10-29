import CategoryCard, { CategoryCardSkeleton, type CategoryItem } from '@/components/CategoryCard';

export type ScentItem = CategoryItem;

export default function ScentCard(props: any) {
    const category = props.scent || props.category;
    const showTitle = props.showTitle !== undefined ? props.showTitle : Boolean(props.compact);
    return <CategoryCard {...props} category={category} showTitle={showTitle} />;
}

export const ScentCardSkeleton = CategoryCardSkeleton;
