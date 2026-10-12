import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { productLevelOptions, productSchema, type ProductFormData } from '@/schemas/productSchema'
import {
  useProductBrands,
  useProductCategories,
  useProductCountries,
  useProductFunctions,
  useProductGroups,
} from '@/hooks/useProducts'
import { getSubmitToneClass } from '@/lib/actionButtonStyles'

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => void
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}

export function ProductForm({ defaultValues, onSubmit, isSubmitting, submitLabel, serverError }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: '',
      categoryId: null,
      functionId: null,
      hsCode: '',
      cooId: null,
      brandId: null,
      groupId: null,
      productLevel: '',
      productShelfLife: 12,
      productPackSize: '',
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      reset({
        productName: '',
        categoryId: null,
        functionId: null,
        hsCode: '',
        cooId: null,
        brandId: null,
        groupId: null,
        productLevel: '',
        productShelfLife: 12,
        productPackSize: '',
        ...defaultValues,
      })
    }
  }, [defaultValues, reset])

  const { data: categories, isLoading: loadingCategories } = useProductCategories()
  const { data: functions, isLoading: loadingFunctions } = useProductFunctions()
  const { data: countries, isLoading: loadingCountries } = useProductCountries()
  const { data: brands, isLoading: loadingBrands } = useProductBrands()
  const { data: groups, isLoading: loadingGroups } = useProductGroups()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-gray-700">Basic Information</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Product Name *" error={errors.productName?.message}>
            <input {...register('productName')} className={inputCls} placeholder="Product name" />
          </Field>

          <Field label="Product Category *" error={errors.categoryId?.message}>
            <select {...register('categoryId', numericNullable)} className={inputCls} disabled={loadingCategories}>
              <option value="">Select category</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Function" error={errors.functionId?.message}>
            <select {...register('functionId', numericNullable)} className={inputCls} disabled={loadingFunctions}>
              <option value="">Select function</option>
              {functions?.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </Field>

          <Field label="HS Code">
            <input {...register('hsCode')} className={inputCls} placeholder="HS code" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wider text-gray-700">Product Attributes</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Country of Origin" error={errors.cooId?.message}>
            <select {...register('cooId', numericNullable)} className={inputCls} disabled={loadingCountries}>
              <option value="">Select country</option>
              {countries?.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Brand" error={errors.brandId?.message}>
            <select {...register('brandId', numericNullable)} className={inputCls} disabled={loadingBrands}>
              <option value="">Select brand</option>
              {brands?.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Group" error={errors.groupId?.message}>
            <select {...register('groupId', numericNullable)} className={inputCls} disabled={loadingGroups}>
              <option value="">Select group</option>
              {groups?.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Level">
            <select {...register('productLevel')} className={inputCls}>
              <option value="">Select level</option>
              {productLevelOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </Field>

          <Field label="Product Shelf Life *" error={errors.productShelfLife?.message}>
            <input
              type="number"
              min={12}
              step={1}
              {...register('productShelfLife', numericRequired)}
              className={inputCls}
              placeholder="Shelf life in months"
            />
          </Field>

          <Field label="Product Pack Size">
            <input {...register('productPackSize')} className={inputCls} placeholder="Pack size" />
          </Field>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${getSubmitToneClass(submitLabel)} inline-flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

const numericNullable = {
  setValueAs: (value: string | number | null | undefined) =>
    value === '' || value === undefined || value === null ? null : Number(value),
}

const numericRequired = {
  setValueAs: (value: string | number | null | undefined) =>
    value === '' || value === undefined || value === null ? Number.NaN : Number(value),
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500'

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}